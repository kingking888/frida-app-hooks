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

//查看域值
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
    input = input.concat("Inspecting Fields: => isInstance", isInstance, " => ", obj_class.toString());
    input = input.concat("\r\n")
    var fields = obj_class.getDeclaredFields();
    for (var i in fields) {
        if (isInstance || Boolean(fields[i].toString().indexOf("static ") >= 0)) {
            // output = output.concat("\t\t static static static " + fields[i].toString());
            var className = obj_class.toString().trim().split(" ")[1];
            // console.log("className is => ",className);
            var fieldName = fields[i].toString().split(className.concat(".")).pop();
            var fieldType = fields[i].toString().split(" ").slice(-2)[0];
            var fieldValue = undefined;
            if (!(obj[fieldName] === undefined))
                fieldValue = obj[fieldName].value;
            input = input.concat("fieldType:" + fieldType + " \tfieldName:" + fieldName + " =>fieldValue:", fieldValue + " =>JSON.stringify(fieldValue)", JSON.stringify(fieldValue));
            input = input.concat("\n")
        }
    }
    return input;
}

// trace单个类的所有静态和实例方法包括构造方法 trace a specific Java Method
function traceMethod(targetClassMethod) {
    var delim = targetClassMethod.lastIndexOf(".");
    if (delim === -1) return;
    var targetClass = targetClassMethod.slice(0, delim)
    var targetMethod = targetClassMethod.slice(delim + 1, targetClassMethod.length)
    var hook = Java.use(targetClass);
    var overloadCount = hook[targetMethod].overloads.length;
    console.log("Tracing Method : " + targetClassMethod + " [" + overloadCount + " overload(s)]");
    for (var i = 0; i < overloadCount; i++) {
        hook[targetMethod].overloads[i].implementation = function () {
            //初始化输出
            var output = "";
            //画个横线
            for (var p = 0; p < 100; p++) {
                output = output.concat("==");
            }
            output = output.concat("\r\n")
            //域值
            output = inspectObject(this, output);
            //进入函数
            output = output.concat("\n*** entered " + targetClassMethod);
            output = output.concat("\r\n")
            if (arguments.length) console.log();
            //参数
            for (var j = 0; j < arguments.length; j++) {
                output = output.concat("arg[" + j + "]: " + arguments[j] + " => " + JSON.stringify(arguments[j]));
                output = output.concat("\r\n")
            }
            //调用栈
            output = output.concat(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            output = output.concat("\r\n")
            var retval = this[targetMethod].apply(this, arguments);
            //返回值
            output = output.concat("\nretval: " + retval + " => " + JSON.stringify(retval));
            output = output.concat("\r\n")
            // inspectObject(this)
            //离开函数
            output = output.concat("\n*** exiting " + targetClassMethod);
            output = output.concat("\r\n")
            //最终输出
            console.log(output);
            return retval;
        }
    }
}

function traceClass(targetClass) {
    //Java.use是新建一个对象哈，大家还记得么？
    var hook = Java.use(targetClass);
    //利用反射的方式，拿到当前类的所有方法
    var methods = hook.class.getDeclaredMethods();
    //建完对象之后记得将对象释放掉哈
    hook.$dispose;
    //将方法名保存到数组中
    var parsedMethods = [];
    var output = "";
    output = output.concat("\tSpec: => \r\n")
    methods.forEach(function (method) {
        output = output.concat(method.toString())
        output = output.concat("\r")
        parsedMethods.push(method.toString().replace(targetClass + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
    });
    //去掉一些重复的值
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
    //对数组中所有的方法进行hook，
    Targets.forEach(function (targetMethod) {
        traceMethod(targetClass + "." + targetMethod);
    });
    //画个横线
    for (var p = 0; p < 100; p++) {
        output = output.concat("+");
    }
    console.warn(output);
}


function print_pretty(bytearry) {
    var buffer = Java.array('byte', bytearry);
    var result = "\r\ncharcode:\r\n";
    for (var i = 0; i < buffer.length; ++i) {
        result += (String.fromCharCode(buffer[i] & 0xff)); // here!!
    }
    result += '\r\nhex:\r\n'
    const HexClass = Java.use('org.apache.commons.codec.binary.Hex');
    const StringClass = Java.use('java.lang.String');
    const hexChars = HexClass.encodeHex(bytearry);
    result += StringClass.$new(hexChars).toString();
    console.log("print_pretty =>", result);

}

function call_aa4() {
    var WeicoSecurityUtils = Java.use("com.sina.weibo.security.WeicoSecurityUtils");
    // CypCHG2kSlRkdvr2RG1QF8b2lCWXl7k7
    var result = WeicoSecurityUtils.aa4('1777391a123456', '1299295010', 'CypCHG2kSlRkdvr2RG1QF8b2lCWXl7k7');
    const StringClass = Java.use('java.lang.String');
    console.log("aa4 result :", result);
    return StringClass.$new(result);
}


function print_stack() {
    Java.perform(function () {
        var Exception = Java.use("java.lang.Exception");
        var instance = Exception.$new("print_stack");
        var stack = instance.getStackTrace();
        console.log(stack.map((traceElement) => traceElement.toString() + "\n\t").join(""));
        instance.$dispose();
    });
}


function print_bytes_array(bytearray) {
    var bytearray_json = JSON.stringify(bytearray);
    // console.log(bytearray_json, typeof bytearray_json);
    //"[97,49,50,51,52,53,54]"
    var bytes_list = bytearray_json.substr(1, bytearray_json.length - 2).split(",");
    var bytes_str = "";
    // console.log(bytes_list);
    for (var i = 0; i < bytes_list.length; i++) {
        // if (bytes_list[i] < 0) {
        //     bytes_list[i] = bytes_list[i] + 255;
        // }
        bytes_str += String.fromCharCode(bytes_list[i]);
    }
    return bytes_str;
}

function hook_java() {
    Java.perform(function () {

        // Base64.encode.overload('[B', 'int').implementation = function (bytearry, str) {
        //     console.log("Base64: arg0 ", JSON.stringify(bytearry));
        //     var result = Base64.encode(bytearry, str);
        //     console.log("Base64: arg1 ", str, "result:", JSON.stringify(result));
        //     console.log(print_pretty(result));
        //     return result;
        // };
        // trace class
        // traceClass('com.sina.weibo.security.WeicoSecurityUtils');

        //pin 参数
        // sprintf(v9, "%svr2RG1%s", "CypCHG2kSlRkd", "QF8b2lCWXl7k7");
        //CypCHG2kSlRkdvr2RG1QF8b2lCWXl7k7


        // s 参数
        // CypCHG2kSlRkdvr2RG1QF8b2lCWXl7k7
        // CypCHG2kSlRkdvr2RG1QF8b2lCWXl7k7


        var WeicoSecurityUtils = Java.use("com.sina.weibo.security.WeicoSecurityUtils");
        WeicoSecurityUtils.aa4.overload('java.lang.String', 'java.lang.String', 'java.lang.String').implementation = function (str1, str2, str3) {
            var result = this.aa4(str1, str2, str3);
            var jstringClass = Java.use("java.lang.String");
            console.log("WeicoSecurityUtils.aa4:", "str1:", str1, "str2:", str2, "str3:", str3, "result:", result);
            print_stack();
            return jstringClass.$new(result);
        };
        //
        // p参数
        // p String(Base64.encode(encryptByPublicKey(str.getBytes(), str2), 2));
        /*
        *   MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC46y69c1rmEk6btBLCPgxJkCxdDcAH9k7kBLffgG1KWqUErjdv+aMkEZmBaprEW846YEw
            Bn60gyBih3KU518fL3F+sv2b6xEeOxgjWO+NPgSWmT3q1up95HmmLHlgVwqTKqRUHd8+Tr43D5h+J8T69etX0YNdT5ACvm+Ar0HdarwIDAQAB
        *
        * */
        WeicoSecurityUtils.securityPsd.overload('java.lang.String', 'java.lang.String').implementation = function (str1, str2) {
            var result = this.securityPsd(str1, str2);
            var jstringClass = Java.use("java.lang.String");
            console.log("WeicoSecurityUtils.securityPsd:", "str1:", str1, "str2:", str2, "result:", result);
            //print_stack();
            return jstringClass.$new(result);
        };
        WeicoSecurityUtils.encryptByPublicKey.overload('[B', 'java.lang.String').implementation = function (bytearray, str) {
            var encryptByPublicKey_result = this.encryptByPublicKey(bytearray, str);
            var bytes_str = print_bytes_array(bytearray);
            console.log("bytearray toStirng->", bytes_str);
            // console.log("encryptByPublicKey result", print_bytes_array(encryptByPublicKey_result));
            var Base64 = Java.use("android.util.Base64");
            var result_base64 = Base64.encode(encryptByPublicKey_result, 2);
            console.log("encryptByPublicKey:", JSON.stringify(bytearray), str,
                JSON.stringify(encryptByPublicKey_result), "base64:", print_bytes_array(result_base64));
            // print_stack();
            return encryptByPublicKey_result;
        }
        // login
        var SinaLoginMainActivity = Java.use("com.weico.international.activity.SinaLoginMainActivity");
        SinaLoginMainActivity.refreshSinaToken.overload('java.lang.String', 'java.lang.String', 'java.lang.String', 'java.lang.String', 'java.lang.String', 'com.weibo.sdk.android.api.WeicoCallbackString').implementation = function (str, str2, str3, str4, str5, weicoCallbackString) {
            var result = this.refreshSinaToken(str, str2, str3, str4, str5, weicoCallbackString);
            console.log("SinaLoginMainActivity:", str, str2, str3, str4, str5, weicoCallbackString);
            return result;
        }

    });
}


function hook_libart() {
    var module_libart = Process.findModuleByName("libart.so");
    var symbols = module_libart.enumerateSymbols();     //枚举模块的符号
    var addr_GetStringUTFChars = null;
    var addr_FindClass = null;
    var addr_GetStaticFieldID = null;
    var addr_SetStaticIntField = null;
    var addr_RegisterNatives = null;
    var addr_CallStaticObjectMethod = null;
    var addr_GetStaticMethodID = null;
    console.log("going hook_libart！")
    for (var i = 0; i < symbols.length; i++) {
        var name = symbols[i].name;
        if (name.indexOf("art") >= 0) {
            if ((name.indexOf("CheckJNI") == -1) && (name.indexOf("JNI") >= 0)) {
                // if (name.indexOf("GetStringUTFChars") >= 0) {
                //     console.log(name);
                //     addr_GetStringUTFChars = symbols[i].address;
                // } else if (name.indexOf("FindClass") >= 0) {
                //     console.log(name);
                //     addr_FindClass = symbols[i].address;
                // } else if (name.indexOf("GetStaticFieldID") >= 0) {
                //     console.log(name);
                //     addr_GetStaticFieldID = symbols[i].address;
                // } else if (name.indexOf("SetStaticIntField") >= 0) {
                //     console.log(name);
                //     addr_SetStaticIntField = symbols[i].address;
                // } else if (name.indexOf("RegisterNatives") >= 0) {
                //     console.log(name);
                //     addr_RegisterNatives = symbols[i].address;
                // } else if (name.indexOf("CallStaticObjectMethod") >= 0) {
                //     console.log(name);
                //     addr_CallStaticObjectMethod = symbols[i].address;
                // } else if (name.indexOf("GetStaticMethodID") >= 0) {
                //     console.log(name);
                //     addr_GetStaticMethodID = symbols[i].address;
                // }
                if (name.indexOf("GetStaticMethodID") >= 0) {
                    console.log(name);
                    addr_GetStaticMethodID = symbols[i].address;
                }
            }
        }
    }

    if (addr_GetStaticMethodID) {
        Interceptor.attach(addr_GetStaticMethodID, {
            onEnter: function (args) {
                var method_name = ptr(args[2]).readCString();
                console.log(method_name);
                if (method_name.indexOf("aa4") > 0) {
                    //"(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;"); 
                    console.log('aa4 called !');
                    for (var i = 0; i < args.length; i++) {
                        console.log("args[" + i + "]:");
                    }
                    // break_flag = true ; 
                }
            }, onLeave: function (retval) {
                console.log(retval)
            }

        })
    }
}


function hook_native() {
    var moudle_base = Module.findBaseAddress("libnative-lib.so");
    // console.log(moudle_base);
    if (moudle_base) {
        // var sub_1C8C = moudle_base.add(0x1C8C + 1);
        // Interceptor.attach(sub_1C8C, {
        //     onEnter: function (args) {
        //         this.input_str1 = args[3];
        //         this.input_str2 = args[4];
        //         console.log('sub_1C8C  onEnter:', "\r\n", hexdump(this.input_str1), "\r\n", hexdump(this.input_str2));
        //     }, onLeave: function (retval) {
        //         console.log('sub_1C8C  onLeave:', "\r\n", retval);
        //         // console.log('sub_1C8C  onLeave; ' + ptr(this.arg1).readCString(), "\r\n", ptr(this.arg2).readCString(), "\r\n: retval :", retval);
        //     }
        // });

        // calc_s
        var suc_2098 = moudle_base.add(0x2098 + 1);
        Interceptor.attach(suc_2098, {
            onEnter: function (args) {
                console.log('suc_2098:onEnter', args[5]);
            }, onLeave: function (retval) {
                console.log('suc_2098:onLeave', parseInt(retval));
            }
        })

        // //VERIFY
        // var sub_1664 = moudle_base.add(0x1664+1) ;
        // Interceptor.attach(sub_1664 , {
        //     onEnter :function(args) {
        //         this.arg0 = args[0];
        //         this.arg1 = args[1];
        //         this.arg2 = args[2];
        //         console.log( "sub_1664,onEnter:" ,  ptr(this.arg2).readCString()) ;
        //     },onLeave:function (retval){
        //         console.log('sub_1664 ,onLeave :' ,retval ) ;
        //     }
        // } )
    }

}

function main() {
    hook_java();
    // hook_native();
    // hook_libart();
}

setImmediate(main)