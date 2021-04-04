function fastjson(instance) {
    try {
        var fastjson = Java.use('com.alibaba.fastjson.JSON');
        return fastjson.toJSONString(instance)
    } catch (error) {
        return JSON.stringify(instance)
        // console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()))

    }
}

function print_stack() {
    return Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new())
}

function Log(input_str) {
    var logs = []
    logs.push("=====================================================")
    logs.push(input_str)
    logs.push(print_stack())
    logs.push("=====================================================")
    console.log(logs.join('\n'))
}


// function  call
function hook_java() {
    Java.perform(function () {
        var SecureNative = Java.use("com.xunmeng.pinduoduo.secure.SecureNative");
        SecureNative.deviceInfo3.implementation = function (context, l, str) {
            var result = SecureNative.deviceInfo3.apply(this, arguments);
            var input_str = "deviceInfo3:\t" + fastjson(context) + "\t" + l + "\t" + str + "result:" + result
            Log(input_str)
            return result
        }
    })
}

function call_antiToken() {
    Java.perform(function () {
        var SecureNative = Java.use("com.xunmeng.pinduoduo.secure.SecureNative");
        var context = Java.use("android.app.ActivityThread").currentApplication().getApplicationContext()
        var ts = Java.use("java.lang.Long").$new(1616123692942)
        var result = SecureNative.deviceInfo3(context, ts, 'ZDGOzHZX')
        console.log('call:', result)
        return result
    })
}

function hook_native() {
    var libpdd_secure_base = Module.getBaseAddress("libpdd_secure.so");
    var sub_11098 = libpdd_secure_base.add(0x11098 + 1);
    Interceptor.attach(sub_11098, {
        onEnter: function (args) {
            // console.log(args.length)
            console.log(hexdump(args[2]), args[3], "\r\n", hexdump(args[4]), args[5], "\r\n", hexdump(args[6]))
        }, onLeave: function (retval) {
        }
    })
    // var  sub_14F18 =  libpdd_secure_base.add(0x14F18+1) ;
    // Interceptor.attach(sub_14F18 , {
    //     onEnter :function ( args ){
    //         this.arg1 = args[1]
    //         console.log("sub_14F18 onEnter:" ,  hexdump(args[1]))
    //     } ,onLeave : function ( retval ){
    //         console.log("sub_14F18 onLeave:" , hexdump(this.arg1 ) )
    //     }
    // })
    // // 10E28
    // var sub_10E28 =  libpdd_secure_base.add(0x10E28 +1 );
    // Interceptor.attach( sub_10E28 , {
    //     onEnter : function ( args) {
    //         this.arg1 = args[1]
    //         this.arg3= args[3]
    //         this.r8 = this.context.x8
    //         console.log(  "10E28 onEnter: " , hexdump(args[1])  ,  args[2]  , "\r\n" ,  hexdump(args[3]))
    //     },onLeave :function (  retval ) {
    //         console.log("10E28 onLeave: "  , retval  , hexdump( this.arg1)  ,"\r\n" ,   hexdump( this.arg3) , "\r\n" ,
    //          Memory.readCString(this.context.x8))
    //     }
    // })

    //
    // var sub_132A4 =  libpdd_secure_base.add(0x132A4 +1 );
    // Interceptor.attach(sub_132A4, {
    //     onEnter: function (args) {
    //         this.arg0 = args[0]
    //         this.arg1 = args[1]
    //         this.arg2 = args[2]
    //         this.arg3 = args[3]
    //         console.log("sub_132A4 onEnter: ", args[0], args[1],  hexdump(args[2]), args[3])
    //     }, onLeave: function (retval) {
    //         // console.log("sub_132A4 onLeave: "  , retval  , hexdump( this.arg1)  ,"\r\n" ,   hexdump( this.arg3) , "\r\n" ,
    //         //  Memory.readCString(this.context.x8))
    //     }
    // })


}


function main() {
    //hook_java()
    // hook_native()
    // stalketrace()

    var symbols = Process.findModuleByName("libpdd_secure.so").enumerateSymbols();
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i].name;
        // console.log(symbol)
        if(symbol.indexOf('info') >=0 ) {
            console.log(symbol)
        }
    }
}


setImmediate(main, 3000)
