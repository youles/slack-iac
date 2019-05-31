#!/usr/bin/env node
const fs = require('fs');

let rawdata = fs.readFileSync('slack-iac.json');
let student = JSON.parse(rawdata);
