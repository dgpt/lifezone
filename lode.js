// Copyright (c) 2014 Parker Miller
// LODE may be freely distributed under the MIT license.

(function(root, createLode) {
    if (typeof define === 'function' && define.amd) {
        define(createLode);
    } else {
        root.LODE = createLode();
    }
}(this, function() {

    function File(path, type) {
        this.path = path;
        this.type = type;
    }

    function createAjaxRequest(fileName, type, onLoad, onError) {
        var request = new XMLHttpRequest();
        request.open("GET", fileName, true);
        request.responseType = type;

        if (onLoad) {
            request.onload = function() {
                if (request.status === 200) { // http status 200 = ok
                    onLoad(request.response);
                } else {
                    if (onError) {
                        onError(request);
                    } else {
                        console.error("Error loading file '" + fileName  + "'.");
                    }
                }
            };
        }

        request.onabort = function() {
            console.error("Loading file '" + fileName + "' has been aborted.");
        };

        return request;
    }

    //Loads Image and Audio assets that have been added.
    function createLoader() {
        'use strict';
        var assets = [];
        var loaded = 0;

        return {
            // If true, loading will stop if an error occurs.
            stopIfErrors: false,

            /* Loads multiple assets.
                dir = directory to load from.
                urls = an array of urls or a key:url object.
                createAsset = the function used to create the asset and add it to the loading queue.
                opt = optional parameters passed to createAsset.
               returns an array or an object of assets depending on what was passed to urls. */
            loadMultiples: function(dir, urls, createAsset, opt) {
                var result;
                if (urls instanceof Array) {
                    result = [];
                    for (var i=0; i<urls.length; ++i) {
                        result.push(createAsset(dir + urls[i], opt));
                    }
                } else {
                    result = {};
                    for (var id in urls) {
                        result[id] = createAsset(dir + urls[id], opt);
                    }
                }
                return result;
            },

            loadImage: function(src) {
                var newImage = new Image();
                newImage.src = src;
                assets.push(newImage);
                return newImage;
            },

            loadImages: function(dir, urls) {
                return this.loadMultiples(dir, urls, this.loadImage, null);
            },

            loadAudio: function(src) {
                var newAudio = new Audio();
                newAudio.src = src;
                assets.push(newAudio);
                return newAudio;
            },

            loadAudios: function(dir, urls) {
                return this.loadMultiples(dir, urls, this.loadAudio, null);
            },

            //Loads a file via ajax. Defaults to loading text.
            loadFile: function(path, type) {
                if (!type) {
                    type = 'text';
                }
                var file = new File(path, type);
                assets.push(file);
                return file;
            },

            loadFiles: function(dir, urls, type) {
                return this.loadMultiples(dir, urls, this.loadFile, type);
            },

            /* Loops through the asset queue loading files and checking if images and audio are ready.
                callbacks = Defaults to onLoadComplete, pass an object of functions for multiple callbacks.
                  onLoadComplete(erroredAssets) = Once all loading has been completed. erroredAssets = A list of assets which have errored.
                  onLoadFail() = If loading has failed. Only called if stopIfErrors is true.
                  onFileLoad(ratio) = When one file has finished loading. ratio = current loading percentage.
                  onFileError(file) = When one file has errored. file = the errored file. */
            load: function(callbacks) {
                var stopIfErrors = this.stopIfErrors;
                var erroredAssets = [];

                if (typeof callbacks === 'function') {
                    callbacks = {onLoadComplete: callbacks};
                }

                var loadComplete = function() {
                    loaded++;

                    // Called when a file has loaded. Gives you the ratio of files loaded.
                    if (callbacks.onFileLoad) {
                        callbacks.onFileLoad(loaded / assets.length);
                    }

                    if (loaded >= assets.length) {
                        if (callbacks.onLoadComplete) {
                            callbacks.onLoadComplete(erroredAssets);
                        }
                    }
                };

                var loadError = function(asset) {
                    erroredAssets.push(asset);

                    if (callbacks.onFileError) {
                        callbacks.onFileError(asset);
                    }

                    if (stopIfErrors) {
                        if (callbacks.onLoadFail) {
                            callbacks.onLoadFail();
                        }
                    } else {
                        // Continue loading even though this file failed.
                        loadComplete();
                    }
                };

                if (assets.length <= 0) {
                    loadComplete();
                }

                for (var i=0; i<assets.length; i++) {
                    var asset = assets[i];
                    if (asset instanceof Image) {
                        asset.addEventListener('load', function() {
                            loadComplete();
                        });

                        asset.addEventListener('error', function(e) {
                            loadError(asset);
                        });
                    } else if (asset instanceof Audio) {
                        asset.addEventListener('loadeddata', function() {
                            loadComplete();
                        });

                        asset.addEventListener('error', function() {
                            loadError(asset);
                        });
                    } else if (asset instanceof File) {
                        (function(asset) {
                            var request = createAjaxRequest(asset.path, asset.type, function(data) {
                                asset.data = data;
                                loadComplete();
                            }, function onFileError() {
                                loadError(asset);
                            });
                            request.send();
                        })(asset);
                    }
                }
            }
        };
    }

    return {
        VERSION: '0.2.0',
        File: File,
        createAjaxRequest: createAjaxRequest,
        createLoader: createLoader,
    };

}));
