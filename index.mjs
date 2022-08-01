#!/usr/bin/node

import { get } from 'https'; // or 'https' for https:// URLs
import { existsSync, writeFileSync, readFileSync, fstat, writeFile } from 'fs';
import { homedir } from "os";
import decmprs from "decompress";
import chalk from 'chalk';
import { ArgumentParser } from 'argparse';
import fetch from 'node-fetch'
import { text as _text } from 'input';
import { exec } from 'child_process';

async function question(text, default_value) {
    const ans = await _text(text, { default: default_value });

    return (ans)
}



const parser = new ArgumentParser({
    description: 'POP is a package manager that aims to be a\nreplacement for KAP and DPKG On Kux.'
});

let sample_pop_config = {
    "repos": {
        "dax-stable": "https://raw.githubusercontent.com/thekaigonzalez/DaxRepo/stable",
    }
}

const pkgcmds = parser.add_subparsers({ help: "Package Commands." })

let action = pkgcmds.add_parser("install", {})
let getlocal = pkgcmds.add_parser("build", {})


action.add_argument("pkg", { help: "The package to (install)" })
getlocal.add_argument("dir", { default: null, help: "The directory to build using Popfile." })

let args = parser.parse_args();
let pop_conf = homedir() + "/.pop"

if (!existsSync(pop_conf)) {
    console.log("warning: config file does not exist")
    console.log("creating basic file")
    writeFileSync(pop_conf, JSON.stringify(sample_pop_config))
}

let popConf = JSON.parse(readFileSync(pop_conf));

let pkg_exists = 0;

console.log("resolving package...")
if (args.dir != null) {
    if (args.dir[args.dir.length-1]=="/")args.dir=args.dir.substring(0,args.dir.length-1)

    console.log("looking for " + args.dir + "/Popfile...")

    if (existsSync(args.dir + "/Popfile")) {
        let popfile = JSON.parse(readFileSync(args.dir + "/Popfile"));

        if (popfile.depends_bins != null) {
            for (let i = 0 ; i < popfile.depends_bins.length; ++i) {
                let m = popfile.depends_bins[i]

                if (!existsSync(m)) {
                    console.error(chalk.redBright("error:") + " could not find required dependent, '" + m + "'")
                }
            }
        }
        if (popfile.install_commands != null) {
            for (let i = 0 ; i < popfile.install_commands.length; ++i) {
                let m = popfile.install_commands[i]

                exec(m);
            }
        }


    }
} else {
    Object.keys(popConf.repos).forEach(branch => {
        fetch(popConf.repos[branch] + "/" + args.pkg, { method: "GET" })
            .then(async (response) => {
                console.log("hi")
                let bin = await response.arrayBuffer()

                if (response.status != 400) {
                    console.log(chalk.yellowBright("found package!"))
                    console.log("would you like to install the following package?\n\t" + chalk.blueBright(args.pkg) + "\n")
                    let yn = await question("Would you like to install the package?", "no")

                    if (yn == "yes") {
                        console.log("creating file pipe...")
                        bin = Buffer.from(bin)
                        writeFileSync(args.pkg, bin)
                    }

                    pkg_exists = 1
                }
            }).catch((e) => {
                console.log(e)
            })
    })
}