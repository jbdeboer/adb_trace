#!/bin/sh

python ./adb_profile_chrome.py --time 100 --json -o profile.json
node report.js profile.json

