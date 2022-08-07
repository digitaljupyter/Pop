#!/usr/bin/node

import {
    get
} from 'https'; // or 'https' for https:// URLs
import {
    existsSync,
    writeFileSync,
    readFileSync,
    fstat,
    writeFile
} from 'fs';
import {
    homedir
} from "os";
import decmprs from "decompress";
import chalk from 'chalk';
import {
    ArgumentParser
} from 'argparse';
import fetch from 'node-fetch'
import { text as _text } from 'input';
import { exec } from 'child_process';

async function question(text, default_value) {
    const ans = await _text(text, { default: default_value });

    return (ans)
}

const parser = new ArgumentParser({
    description: 'POP is the package manager which can be configured for ANY system!'
});


let sample_pop_config = {
    "repos": {
        "dax-stable": "https://raw.githubusercontent.com/thekaigonzalez/DaxRepo/stable",
        "core": "https://raw.githubusercontent.com/thekaigonzalez/DaxRepo/core"
    },
    "bindir": "./packages"
}

const pkgcmds = parser.add_subparsers({ help: "Package Commands." })

let action = pkgcmds.add_parser("install", {})
let getlocal = pkgcmds.add_parser("build", {})


action.add_argument("pkg", { help: "The package to (install)", nargs: "+" })
getlocal.add_argument("dir", { default: null, help: "The directory to build using Popfile."})

let args = parser.parse_args();
let pop_conf = homedir() + "/.pop"

if (!existsSync(pop_conf)) {
    console.log("warning: config file does not exist")
    console.log("creating basic file")
    writeFileSync(pop_conf, JSON.stringify(sample_pop_config))
}

let popConf = JSON.parse(readFileSync(pop_conf));

let pkg_exists = 0;

console.log("resolving package(s)...")

if (args.pkg.length == 0) {
	console.log("

if (args.dir != null) {
    if (args.dir[args.dir.length - 1] == "/") args.dir = args.dir.substring(0, args.dir.length - 1)

    console.log("looking for " + args.dir + "/Popfile...")

    if (existsSync(args.dir + "/Popfile")) {
        let popfile = JSON.parse(readFileSync(args.dir + "/Popfile"));

        if (popfile.depends_bins != null) {
            for (let i = 0; i < popfile.depends_bins.length; ++i) {
                let m = popfile.depends_bins[i]

                if (!existsSync(m)) {
                    console.error(chalk.redBright("error:") + " could not find required dependent, '" + m + "'")
                }
            }
        }
        if (popfile.install_commands != null) {
            for (let i = 0; i < popfile.install_commands.length; ++i) {
                let m = popfile.install_commands[i]

                exec(m);
            }
        }


    }
} else {
    let install_queue = {}
    let successful_queue = []
    for (const branch in popConf.repos) {
        /*
        if (yn == "yes") {
                            console.log("creating file pipe...")
                            bin = Buffer.from(bin)
                            writeFileSync(args.pkg, bin)
                            console.log("wrote file!");
                        }
        */

        for (let i = 0; i < args.pkg.length; ++i) {
            let pkg = args.pkg[i];

            let response = await fetch(popConf.repos[branch] + "/" + pkg, { method: "GET" })

            var twirlTimer = (function () {
                var P = ["\\", "|", "/", "-"];
                var x = 0;
                return setInterval(function () {
                    process.stdout.write("\r" + P[x++]);
                    x &= 3;
                }, 250);
            })();
	    // Don't wanna have to update the package format again...
            if (response.status != 400 && response.status != 404) {
                install_queue[pkg] = {}

                install_queue[pkg]["repository_link"] = popConf.repos[branch]
                install_queue[pkg]["exists"] = 1
            }
            clearInterval(twirlTimer)
        }
    }
    for (let i = 0; i < args.pkg.length; ++i) {
        let pkg = args.pkg[i]
        if (!(pkg in install_queue)) {
            install_queue[pkg] = {}
            install_queue[pkg]['exists'] = 0
        }
        if (install_queue[pkg]['exists'] == 0) {
            console.log(chalk.redBright("error: package '" + pkg + "' was not found."))
            delete install_queue[pkg]
        }
    }
    for (const pkg in install_queue) {
        successful_queue.push(pkg)
    }
    console.log("the following packages will be installed: \n\t" + chalk.blueBright(successful_queue.join(" ")));

    let que = await question("would you like to continue?", "yes")

    if (que == "no") {
        console.log("alright. action abandoned.")
        process.exit(0)
    }
    for (const pkg in install_queue) {
        if (install_queue[pkg]['exists'] == 1) {
            let response = await fetch(install_queue[pkg]['repository_link'] + "/" + pkg, { method: "GET" })
            console.log("downloading package - `" + pkg + "'")


            let bin = Buffer.from(await response.arrayBuffer())

            console.log('writing package to file . . .');

            if (popConf.bindir == null) popConf.bindir = "./"

            if (popConf.bindir[popConf.bindir.length - 1] == "/") popConf.bindir = popConf.bindir.substring(0, popConf.bindir.length - 1)

            writeFileSync(popConf.bindir + "/" + pkg, bin)


            console.log(chalk.greenBright("done!"))
        }
    }
}
