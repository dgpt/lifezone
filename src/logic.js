export class Game {
    constructor() {
        this.startNewGame();
    }

    startNewGame() {
        this.modules = [];
        this.researchPointsPerTurn = 0;
        this.researchPoints = 0;
        this.money = 0;
        this.startingPopulation = 10;
        this.moduleGrid = new ModuleGrid(4, 4);
        this.buildDefaultModules();
    }

    buildDefaultModules() {
        var researchMod = new ResearchModule();
        var devMod = new DevelopmentModule();
        researchMod.build();
        devMod.build();
        this.moduleGrid.setModule(0,0, researchMod);
        this.moduleGrid.setModule(1,0, devMod);
    }

    buildModule(module) {
        this.modules.push(module);
        this.money -= module.getPrice();
        module.build();
    }

    destroyModule(module) {
        this.modules.splice(this.modules.indexOf(module), 1);
        this.money += module.getPrice() * 0.75;
        module.destroy();
    }

    getPopulation() {
        var pop = 0;
        for (var module of this.modules) {
            if (module.getPopulationIncome) {
                pop += module.getPopulationIncome();
            }
        }
        return pop + this.startingPopulation;
    }

    getUsedPopulation() {
        var pop = 0;
        for (var module of this.modules) {
            pop += module.getRequiredPopulation();
        }
        return pop;
    }

    endTurn() {
        for (var module of this.modules) {
            if (module.getResearchIncome) {
                this.researchPoints += module.getResearchIncome();
            }
            this.money += module.getMoneyIncome();
        }
        this.money += 10;
    }
}

export class ModuleGrid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = [];
    }

    getIndex(x, y) {
        if ((x < 0 || x >= this.width) || (y < 0 || y >= this.height)) {
            return -1;
        }
        return y * this.width + x;
    }

    setModule(x, y, module) {
        this.cells[this.getIndex(x, y)] = module;
    }

    getModule(x, y) {
        var index = this.getIndex(x, y);
        if (index <= -1) return null;
        var module = this.cells[index];
        if (module) {
            return module;
        } else {
            return null;
        }
    }
}

export class Module {
    constructor(game) {
        this.game = game;
        this.requiredPop = 0;
        this.price = 0;
        this.upgrades = {};
    }

    addUpgrades(upgrades) {
        for (var upgrade of upgrades) {
            this.upgrades[upgrade.id] = upgrade;
        }
    }

    build() {
        if (this.onBuild) this.onBuild();
    }

    destroy() {
        if (this.onDestroy) this.onDestroy();
    }

    applyUpgrade(id, level) {
        var upgrade = this.upgrades[id];
        if (upgrade) {
            upgrade.apply(level);
        } else {
            throw new Error("Upgrade '" + id + "' not found");
        }
    }

    getPrice() {
        return this.price;
    }

    getRequiredPopulation() {
        return this.requiredPop;
    }

    getMoneyIncome() {
        return 0;
    }
}

class Upgrade {
    constructor(id, maxLevel, prices, opt) {
        this.id = id;
        this.maxLevel = maxLevel;
        this.prices = prices;
        this.opt = opt;
    }

    apply(level) {
        if (this.opt.onApply) {
            this.opt.onApply(level);
        }
    }
}

export class ResearchModule extends Module {
    constructor(game) {
        super(game);
        this.researchAmount = 1;
        this.requiredPop = 2;
        this.price = 200;
        this.income = 0;
        this.addUpgrades([
            new Upgrade('researchUp', 4, [100, 200, 400, 1000], {
                onApply: (level) => {
                    this.researchAmount = (1 * level) + 1;
                }
            }), new Upgrade('sellByproducts', 4, [100, 200, 400, 1000], {
                onApply: (level) => {
                    this.income = (1 * level) + 1;
                }
            }),
        ]);
    }

    getMoneyIncome() {
        return this.income;
    }

    getResearchIncome() {
        return this.researchAmount;
    }
}

export class DevelopmentModule extends Module {
    constructor(game) {
        super(game);
        this.buildSpeed = 1;
        this.requiredPop = 2;
        this.price = 200;
        this.addUpgrades([
            new Upgrade('buildSpeedUp', 4, [100, 200, 400, 1000], {
                onApply: (level) => {
                    this.buildSpeed = (1 * level) + 1;
                }
            })
        ]);
    }
}

export class HousingModule extends Module {
    constructor(game) {
        super(game);
        this.capacity = 1;
        this.price = 200;
        this.addUpgrades([
            new Upgrade('capacityUp', 4, [100, 200, 400, 1000], {
                onApply: (level) => {
                    this.capacity = (1 * level) + 1;
                }
            })
        ]);
    }

    getPopulationIncome() {
        return this.capacity;
    }
}

export class MiningModule extends Module {
    constructor(game) {
        super(game);
        this.income = 2;
        this.requiredPop = 3;
        this.price = 300;
        this.addUpgrades([
            new Upgrade('incomeUp', 4, [100, 200, 400, 1000], {
                onApply: (level) => {
                    this.income = (2 * level) + 2;
                }
            })
        ]);
    }

    getMoneyIncome() {
        return this.income;
    }
}
