function hook_java() {
}

function hook_native() {
}

function main() {
    hook_java()
    hook_native()
}

setImmediate(main)
