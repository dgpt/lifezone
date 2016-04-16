test('Research module', function() {
    var game = new Game();
    var rmod = new ResearchModule(game);
    game.buildModule(rmod);
    game.endTurn();
    ok(game.researchPoints === rmod.getResearchIncome(), 'Earned research points on turn end');
    ok(game.getUsedPopulation() === rmod.getRequiredPopulation(), "Used population is equal to module's required population");
});

test('ModuleGrid.getIndex', function() {
    var grid = new ModuleGrid(4, 4);
    ok(grid.getIndex(0, 0) === 0);
    ok(grid.getIndex(1, 0) === 1);
    ok(grid.getIndex(0, 1) === 4);
    ok(grid.getIndex(1, 1) === 5);
    ok(grid.getIndex(3, 3) === 15);
    ok(grid.getIndex(4, 0) === -1);
    ok(grid.getIndex(0, 4) === -1);
    ok(grid.getIndex(-1, 0) === -1);
    ok(grid.getIndex(0, -1) === -1);
});

test('ModuleGrid.get/setModule', function() {
    var grid = new ModuleGrid(4, 4);
    var mod = new ResearchModule();
    grid.setModule(2,2, mod);
    ok(grid.getModule(2,2) === mod);
    ok(grid.getModule(2,3) === null);
    ok(grid.getModule(4,0) === null);
    ok(grid.getModule(0,4) === null);
    ok(grid.getModule(-1,0) === null);
    ok(grid.getModule(0,-1) === null);
});
