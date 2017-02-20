var TestControl = {
    testArrayDecoders: function () {
        function checkEquality (a,b) {
            if (a.length != b.length) {
                TestControl.logTestResult(a);
                TestControl.logTestResult(b);
                return false;
            }
            for (var i = 0; i < a.length; i++) {
                if (a[i] != b[i]) {
                    TestControl.logTestResult(a);
                    TestControl.logTestResult(b);
                    return false;
                }
            }
            return true;
        }
        var result = [
            [0],
            [1],
            [0,1],
            [1,0],
            [0,0,0],
            [0,0,1],
            [1,0,1],
            [1,1,1],
            [0,1,1,1],
            [0,0,0,0,0,0,0,0],
            [1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0],
            [1,0,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0],
            [1,0,0,0,0,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0],
        ].map(function (arr) {
            if (!checkEquality(arr,
                              Coders.string2BinArray(Coders.binArray2String(arr)))) {
                                  TestControl.logTestResult('array decoders test failed')
            }
        })
    },
    testNumCharDecoders: function () {
        for (var i = 0; i < 10000; i++) {
            if (Coders.char2Num(Coders.num2Char(i)) != i) {
                TestControl.logTestResult('char decoders test failed!');
                return;
            }
        }
    },
    testPNGExporting: function () {
        lex.selection.x1 = 0;
        lex.selection.x2 = 4;
        lex.selection.y1 = 0;
        lex.selection.y2 = 4;
        lex.selection.set = true;
        DrawControl.redrawAll();
        ExportControl.exportToPNG();
    },
    logTestResult: function (result) {
        console.log(result);
    },
    runAll: function () {
        TestControl.testNumCharDecoders();
        TestControl.testArrayDecoders();
    },
}
