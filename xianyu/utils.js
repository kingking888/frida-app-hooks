var ByPassTracerPid = function () {
    var fgetsPtr = Module.findExportByName("libc.so", "fgets");
    var fgets = new NativeFunction(fgetsPtr, 'pointer', ['pointer', 'int', 'pointer']);
    Interceptor.replace(fgetsPtr, new NativeCallback(function (buffer, size, fp) {
        var retval = fgets(buffer, size, fp);
        var bufstr = Memory.readUtf8String(buffer);
        if (bufstr.indexOf("TracerPid:") > -1) {
            Memory.writeUtf8String(buffer, "TracerPid:\t0");
            console.log("tracerpid replaced: " + Memory.readUtf8String(buffer));
        }
        return retval;
    }, 'pointer', ['pointer', 'int', 'pointer']));
};
setImmediate(ByPassTracerPid);

(function(){
    let Color = {RESET: "\x1b[39;49;00m", Black: "0;01", Blue: "4;01", Cyan: "6;01", Gray: "7;11", "Green": "2;01", Purple: "5;01", Red: "1;01", Yellow: "3;01"};
    let LightColor = {RESET: "\x1b[39;49;00m", Black: "0;11", Blue: "4;11", Cyan: "6;11", Gray: "7;01", "Green": "2;11", Purple: "5;11", Red: "1;11", Yellow: "3;11"};
    var colorPrefix = '\x1b[3', colorSuffix = 'm'
    for (let c in Color){
        if (c  == "RESET") continue;
        console[c] = function(message){
            console.log(colorPrefix + Color[c] + colorSuffix + message + Color.RESET);
        }
        console["Light" + c] = function(message){
            console.log(colorPrefix + LightColor[c] + colorSuffix + message + Color.RESET);
        }
    }
})();
function uniqBy(array, key) {
    var seen = {};
    return array.filter(function (item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}
function hasOwnProperty(obj, name) {
    try {
        return obj.hasOwnProperty(name) || name in obj;
    } catch (e) {
        return obj.hasOwnProperty(name);
    }
}
function getHandle(object) {
    if (hasOwnProperty(object, '$handle')) {
        if (object.$handle != undefined) {
            return object.$handle;
        }
    }
    if (hasOwnProperty(object, '$h')) {
        if (object.$h != undefined) {
            return object.$h;
        }
    }
    return null;
}
//????????????
function inspectObject(obj, input) {
    var isInstance = false;
    var obj_class = null;
    if (getHandle(obj) === null) {
        obj_class = obj.class;
    } else {
        var Class = Java.use("java.lang.Class");
        obj_class = Java.cast(obj.getClass(), Class);
        isInstance = true;
    }
    input = input.concat("Inspecting Fields: => ", isInstance, " => ", obj_class.toString());
    input = input.concat("\r\n")
    var fields = obj_class.getDeclaredFields();
    for (var i in fields) {
        if (isInstance || Boolean(fields[i].toString().indexOf("static ") >= 0)) {
            // output = output.concat("\t\t static static static " + fields[i].toString());
            var className = obj_class.toString().trim().split(" ")[1];
            // console.Red("className is => ",className);
            var fieldName = fields[i].toString().split(className.concat(".")).pop();
            var fieldType = fields[i].toString().split(" ").slice(-2)[0];
            var fieldValue = undefined;
            if (!(obj[fieldName] === undefined))
                fieldValue = obj[fieldName].value;
            input = input.concat(fieldType + " \t" + fieldName + " => ", fieldValue + " => ", JSON.stringify(fieldValue));
            input = input.concat("\r\n")
        }
    }
    return input;
}

// trace????????????????????????????????????????????????????????? trace a specific Java Method
function traceMethod(targetClassMethod) {
    var delim = targetClassMethod.lastIndexOf(".");
    if (delim === -1) return;
    var targetClass = targetClassMethod.slice(0, delim)
    var targetMethod = targetClassMethod.slice(delim + 1, targetClassMethod.length)
    var hook = Java.use(targetClass);
    var overloadCount = hook[targetMethod].overloads.length;
    console.Red("Tracing Method : " + targetClassMethod + " [" + overloadCount + " overload(s)]");
    for (var i = 0; i < overloadCount; i++) {
        hook[targetMethod].overloads[i].implementation = function () {
            //???????????????
            var output = "";
            //????????????
            for (var p = 0; p < 100; p++) {
                output = output.concat("==");
            }
            console.Gray(output);
            var output = "";
            //??????
            output = inspectObject(this, output);
            console.Blue(output);
            var output = "";
            //????????????
            output = output.concat("\n*** entered " + targetClassMethod);
            output = output.concat("\r\n")
            if (arguments.length) console.Black();
            //??????
            for (var j = 0; j < arguments.length; j++) {
                output = output.concat("arg[" + j + "]: " + arguments[j] + " => " + JSON.stringify(arguments[j]));
                output = output.concat("\r\n")
            }
            //?????????
            output = output.concat(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.Green(output);
            var output = "";
            var retval = this[targetMethod].apply(this, arguments);
            //?????????
            output = output.concat("\nretval: " + retval + " => " + JSON.stringify(retval));
            // inspectObject(this)
            //????????????
            output = output.concat("\n*** exiting " + targetClassMethod);
            //????????????
            console.Black(output);
            return retval;
        }
    }
}

function traceClass(targetClass) {
    //Java.use????????????????????????????????????????????????
    var hook = Java.use(targetClass);
    //??????????????????????????????????????????????????????
    var methods = hook.class.getDeclaredMethods();
    //?????????????????????????????????????????????
    hook.$dispose;
    //??????????????????????????????
    var parsedMethods = [];
    var output = "";
    output = output.concat("\tSpec: => \r\n")
    methods.forEach(function (method) {
        output = output.concat(method.toString())
        output = output.concat("\r\n")
        parsedMethods.push(method.toString().replace(targetClass + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
    });
    //????????????????????????
    var Targets = uniqBy(parsedMethods, JSON.stringify);
    // targets = [];
    var constructors = hook.class.getDeclaredConstructors();
    if (constructors.length > 0) {
        constructors.forEach(function (constructor) {
            output = output.concat("Tracing ", constructor.toString())
            output = output.concat("\r\n")
        })
        Targets = Targets.concat("$init")
    }
    //?????????????????????????????????hook???
    Targets.forEach(function (targetMethod) {
        traceMethod(targetClass + "." + targetMethod);
    });
    //????????????
    for (var p = 0; p < 100; p++) {
        output = output.concat("+");
    }
    console.Green(output);
}
function hook(white, black, target = null) {
    console.Red("start")
    if (!(target === null)) {
        console.LightGreen("Begin enumerateClassLoaders ...")
        Java.enumerateClassLoaders({
            onMatch: function (loader) {
                try {
                    if (loader.findClass(target)) {
                        console.Red("Successfully found loader")
                        console.Blue(loader);
                        Java.classFactory.loader = loader;
                        console.Red("Switch Classloader Successfully ! ")
                    }
                }
                catch (error) {
                    console.Red(" continuing :" + error)
                }
            },
            onComplete: function () {
                console.Red("EnumerateClassloader END")
            }
        })
    }
    console.Red("Begin Search Class...")
    var targetClasses = new Array();
    Java.enumerateLoadedClasses({
        onMatch: function (className) {
            if (className.toString().indexOf(white) >= 0 &&
                className.toString().indexOf(black) < 0
            ) {
                console.Black("Found Class => ", className)
                targetClasses.push(className);
                traceClass(className);
            }
        }, onComplete: function () {
            console.Black("Search Class Completed!")
        }
    })
    var output = "On Total Tracing :"+String(targetClasses.length)+" classes :\r\n";
    targetClasses.forEach(function(target){
        output = output.concat(target);
        output = output.concat("\r\n")
    })
    console.Green(output+"Start Tracing ...")
}


