function json_parse(instance) {
    var JSON = Java.use('com.alibaba.fastjson.JSON');
    return JSON.toJSONString(Java.cast(instance,"java.lang.Object"))
}

//  hook 所有函数已经重载
function traceClass(clsname) {
    try {
        var target = Java.use(clsname);
        var methods = target.class.getDeclaredMethods();
        methods.forEach(function (method) {
            var methodName = method.getName();
            var overloads = target[methodName].overloads;
            overloads.forEach(function (overload) {
                var proto = "(";
                overload.argumentTypes.forEach(function (type) {
                    proto += type.className + ", ";
                });
                if (proto.length > 1) {
                    proto = proto.substr(0, proto.length - 2);
                }
                proto += ")";
                let logs = []
                logs.push('======================================================start  hooking =============================')
                logs.push("hooking: " + clsname + "." + methodName + proto)
                overload.implementation = function () {
                    for (var j = 0; j < arguments.length; j++) {
                        logs.push("args[" + j.toString() + "]" + "\t" + arguments[j] + "\tfastjson:" + json_parse(arguments[j]))
                    }
                    var retval = this[methodName].apply(this, arguments);
                    logs.push("retval:", retval);
                    logs.push('======================================================end  hooking =============================')
                    console.log(logs.join('\n'))
                    return retval;
                }
            });
        });
    } catch (e) {
        console.log("'" + clsname + "' hook fail: " + e)
    }
}


function hook_java() {
//com.jingdong.jdsdk.network.toolbox.k

    Java.perform(function () {

        // var class_name = "com.jingdong.jdsdk.network.toolbox.k";
        // traceClass(class_name)
        // var class_k = Java.use("com.jingdong.jdsdk.network.toolbox.k");
        //
        // var all_methods = class_k.class.getDeclaredMethods();
        // for (var i = 0; i < all_methods.length; i++) {
        //     var method = (all_methods[i]);
        //     var methodStr = method.toString();
        //     var substring = methodStr.substr(methodStr.indexOf(class_name) + class_name.length + 1);
        //     var methodname = substring.substr(0, substring.indexOf("("));
        //
        //
        //     // class_k[methodname].implementation = function () {
        //     //     console.log("hook_mul_function:", this);
        //     //     return true;
        //     // }
        //
        // }


        var checkHookG = Java.use('com.jingdong.common.utils.BitmapkitUtils');
        checkHookG.getSignFromJni.implementation = function (a, b, c, d, e, f) {
            var result = this.getSignFromJni(a, b, c, d, e, f);
            for (var i = 0; i < arguments.length; i++) {
                console.log("arg[", i + "]:", arguments[i])
            }
            console.log("checkHookG:result>>", result)
            return result;
        }

    })

}


function call_sign() {
    Java.perform(function () {
        console.log("call ......")
        var Utils = Java.use('com.jingdong.common.utils.BitmapkitUtils');
        //public static native String getSignFromJni(Context context, String str, String str2, String str3, String str4, String str5);
        var context = Java.use('android.content.Context').$new()
        const Jstring = Java.use("java.lang.String");
        var str = Jstring.$new('uniformRecommend')
        var str2 = Jstring.$new('12345678')
        var str3 = Jstring.$new('-404e361f61df')
        var str4 = Jstring.$new('android')
        var str5 = Jstring.$new('9.2.2')
        var result = Utils.getSignFromJni(context, str, str2, str3, str4, str5)
        console.log("call_sign result:", result)

    })


}


function hook_three_addr(addr) {
    var module_base = Process.getModuleByAddress(addr ).base ;
    Interceptor.attach(addr, {
        onEnter: function (args) {
            this.arg0 = args[0]
            this.arg1 = args[1]
            this.arg2 = args[2]
            this.arg3 = args[3]
            this.arg4 = args[4]
            this.logs = []
            // for (var i =0 ;i <5; i++) {
            //     this.logs.push( addr+"onEnter!args  "+ args[i] )
            // }
            //0x10de5
            console.log("--call native:" , addr.sub(module_base))
            // this.logs.push( addr+"onEnter!arg0  "+  hexdump( args[0]) )
            // this.logs.push( addr+"onEnter!arg1 "+  ( args[1]) )
            this.logs.push( addr+"onEnter!arg2 "+ ptr(args[2]).readCString())
            this.logs.push( addr+"onEnter!arg3  "+  ( args[3]) )
            // this.logs.push( addr+"onEnter!arg4  "+  hexdump( args[4]) )

        }, onLeave: function (retval) {
            // this.logs.push( addr+"onLeave!arg0  "+  hexdump( this.arg0) )
            // this.logs.push( addr+"onLeave!arg1  "+  this.arg1)
            this.logs.push( addr+"onLeave!arg2  "+  hexdump(this.arg2) )
            this.logs.push( addr+"onLeave!arg3  "+  this.arg3 )
            // this.logs.push( addr+"onLeave!arg4  "+  hexdump( this.arg4) )
            // this.logs.push( addr+"onLeave!retval  "+  hexdump( retval) )
            console.log(this.logs.join("\n"))
        }


    })


}

function print_arg(addr) {
    var range = Process.findRangeByAddress(addr);
    if (range) {
        return hexdump(addr) + '\n'
    } else {
        return ptr(addr) + "\n"
    }
}


function hook_native() {
    var moudle = Process.getModuleByName("libjdbitmapkit.so");
    var base_module_addr = moudle.base;
    var sub_227C = base_module_addr.add(0x227C + 1);
    // md5
    Interceptor.attach(sub_227C, {
        onEnter: function (args) {
            this.arg0 = args[0]
            this.arg1 = args[1]
            this.arg2 = args[2]
            console.log("sub_227C onEnter:", hexdump(args[0]),  args[1],  "\r\n" , hexdump(args[2]))
        }, onLeave: function (retval) {
            console.log("sub_227C onLeave:", hexdump(retval))
            console.log("sub_227C onLeave:" , hexdump( this.arg0) ,"\r\n" , hexdump( this.arg2 ))
        }
    })

    // base64
    var sub_18B8 = base_module_addr.add(0x18B8 + 1)
    Interceptor.attach(sub_18B8, {
        onEnter: function (args) {
            this.arg0 = args[0];
            console.log("sub_18B8 onEnter:", hexdump(args[1]), "\r\n", args[2])
        }, onLeave: function (retval) {
            console.log("sub_18B8 onLeave:",ptr(this.arg0).readCString())
        }
    })

    // var sub_126AC = base_module_addr.add(0x126AC + 1);
    // Interceptor.attach(sub_126AC, {
    //     onEnter: function (args) {
    //         this.logs = []
    //         this.arg0 = args[0]
    //         this.arg1 = args[1]
    //         this.arg2 = args[2]
    //         this.arg3 = args[3]
    //         this.arg4 = args[4]
    //         this.logs.push("sub_126AC onEnter arg0:" +  print_arg(ptr(args[0])))
    //         this.logs.push("sub_126AC onEnter arg1:" +  print_arg(ptr(args[1])))
    //         this.logs.push("sub_126AC onEnter arg2:" +  print_arg(ptr(args[2])))
    //         this.logs.push("sub_126AC onEnter arg3:" +  print_arg(ptr(args[3])))
    //         this.logs.push("sub_126AC onEnter arg4 :" + print_arg(ptr(args[4])))
    //
    //     }, onLeave: function (retval) {
    //
    //         this.logs.push("sub_126AC onLeave arg0:" +  print_arg( ptr(this.arg0)))
    //         this.logs.push("sub_126AC onLeave arg1:" +  print_arg( ptr(this.arg1)))
    //         this.logs.push("sub_126AC onLeave arg2:" + print_arg(ptr(this.arg2)))
    //         this.logs.push("sub_126AC onLeave arg3:" + print_arg(ptr(this.arg3)))
    //         this.logs.push("sub_126AC onLeave arg4 :" + print_arg(ptr(this.arg4)))
    //         this.logs.push("sub_126AC retval" + print_arg(ptr(retval)))
    //
    //         console.log( this.logs.join('\n'))
    //
    //     }


    // hook_three_addr(  base_module_addr.add( 0x10E18 +1 ))
    // hook_three_addr(  base_module_addr.add( 0x10DE4+1 )) // 算法分支
    // hook_three_addr(  base_module_addr.add( 0x10E4 +1 ))



    // 自定义算法所在
    // arg3 input_buffer
    // arg4 input_len
    // 结果是 args
    // md5(base64(args))
    // base64 自定义码表
    // key
    console.log( "key>>> " , ptr( base_module_addr.add(0x17440)).readCString())

    var sub_12ECC =  base_module_addr.add(0x12ECC +1 ) ;
    Interceptor.attach( sub_12ECC , {
        onEnter : function ( args ) {
            // arg3 input_buffer
            // arg4 input_len
            // arg2 就是1
            // arg1 固定 80306f4370b39fd5630ad0529f77adb6
            // arg0 pointer
            this.arg0 = args[0]
            this.arg3 = args[3]
            this.arg4  =args[4]
            console.log("sub_12ECC onEnter:" , hexdump(args[0])  ,"\r\n" ,  ptr(args[1]).readCString() , "\r\n" ,hexdump(args[3]) ,args[4])
        },onLeave :function ( retval) {
            console.log("sub_12ECC onLeave: " ,hexdump( this.arg3  ,{ length : parseInt(this.arg4)})  )
        }
    })
}

// native 函数主动调用

function  call_12ECC() {
    // call native
    var libjdbitmapkit = Module.findBaseAddress("libjdbitmapkit.so");
    if (libjdbitmapkit) {
        var addr_12ECC = libjdbitmapkit.add(0x12ECC + 1);
        var sub_12ECC = new NativeFunction(addr_12ECC, "void", [ "pointer" , "pointer", "int", "pointer", "int" ]);
        var arg0= '44e715a6e322ccb7d028f7a42fa55040' // 不参与计算
        // var input_str = "0123456789abcdef";
        //st=1615626017738&sign=c092b028106d7c4560f183a4bbe41c53&sv=121
        var input_str ="functionId=uniformRecommend&body=12345678&uuid=-404e361f61df&client=android&clientVersion=9.2.2&st=1615626052687&sv=111"
        // var input_str ="functionId=uniformRecommend&body=12345678&uuid=-404e361f61df&client=android&clientVersion=9.2.2&st=1615626052687&sv=111"
        var input_buffer = Memory.allocUtf8String(input_str);
        sub_12ECC(Memory.allocUtf8String(arg0) ,
            Memory.allocUtf8String("80306f4370b39fd5630ad0529f77adb6"),
            1, input_buffer,  input_str.length );
        // hex
        // afcb2afb1f349bed06555aed7cd37909bbc31efd062a99ec225f8d9e70d17f036687fe8bdff062b6f51792ed47ce14f77d86f0fdd6f16de5f3228dde34c54733aefc3095042990f1245a8d9e71d6400f97ca12fd153ea5ee2b2e46a6009005c0bccaf989d9fc61b5ef2759ad009813d16fc13295d4fc6d
        // afcb2afb1f349bed06555aed7cd37909bbc31efd062a99ec225f8d9e70d17f036687fe8bdff062b6f51792ed47ce14f77d86f0fdd6f16de5f3228dde34c54733aefc3095042990f1245a8d9e71d6400f97ca12fd153ea5ee2b2e46a6009005c0bccaf989d9fc61b5ef265da802a30bdb6fc13295d4fd6c
        // afcb2afb1f349bed06555aed7cd37909bbc31efd062a99ec225f8d9e70d17f036687fe8bdff062b6f51792ed47ce14f77d86f0fdd6f16de5f3228dde34c54733aefc3095042990f1245a8d9e71d6400f97ca12fd153ea5ee2b2e46a6009005c0bccaf989d9fc61b5ef265fac019410de6fc13295d4fd6c
        console.log("call_12ECC result:" ,hexdump(input_buffer, { length: input_str.length }));
    }

}


function main() {
    // hook_java()
    hook_native()
   // hook_native_2()

}

setImmediate(main)


// frida -H 127.0.0.1:1234 com.jingdong.app.mall -l hook.js