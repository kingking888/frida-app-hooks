function LogPrint(log) {
    var threadid = Process.getCurrentThreadId();
    var theDate = new Date();
    var hour = theDate.getHours();
    var minute = theDate.getMinutes();
    var second = theDate.getSeconds();
    var mSecond = theDate.getMilliseconds();
    hour < 10 ? hour = "0" + hour : hour;
    minute < 10 ? minute = "0" + minute : minute;
    second < 10 ? second = "0" + second : second;
    mSecond < 10 ? mSecond = "00" + mSecond : mSecond < 100 ? mSecond = "0" + mSecond : mSecond;
    var time = hour + ":" + minute + ":" + second + ":" + mSecond;
    console.log("tid:" + threadid + "[" + time + "]" + "->" + log);

}

function forceinterpreter() {
    var libartmodule = Process.getModuleByName("libart.so");
    var forceinterpreter_addr = libartmodule.getExportByName("forceinterpreter");
    console.log("forceinterpreter:" + forceinterpreter_addr);
    var forceinterpreter = new NativeFunction(forceinterpreter_addr, "void", []);
    Interceptor.attach(forceinterpreter_addr, {
        onEnter: function (args) {
            console.log("go into forceinterpreter");
        }, onLeave: function (retval) {
            console.log("leave forceinterpreter");
        }
    });
    forceinterpreter();

}

function hookstrstr() {
    var libcmodule = Process.getModuleByName("libc.so");
    var strstr_addr = libcmodule.getExportByName("strstr");
    Interceptor.attach(strstr_addr, {
        onEnter: function (args) {
            this.arg0 = ptr(args[0]).readUtf8String();
            this.arg1 = ptr(args[1]).readUtf8String();
            if (this.arg1.indexOf("InvokeWithArgArray") != -1) {
                LogPrint(this.arg1 + "--" + this.arg0);
            }
            if (this.arg1.indexOf("RegisterNative") != -1) {
                LogPrint(this.arg1 + "--" + this.arg0);
            }
            if (this.arg1.indexOf("PerformCall") != -1) {
                LogPrint(this.arg1 + "--" + this.arg0);
            }
            if (this.arg1.indexOf("JniMethodStart") != -1) {
                LogPrint(this.arg1 + "--" + this.arg0);
            }
            if (this.arg1.indexOf("JniMethodEnd") != -1) {
                LogPrint(this.arg1 + "--" + this.arg0);
            }

        }
    })
}

function main() {
    forceinterpreter();
    hookstrstr();

}

setImmediate(main);