
function cleanup {
    echo "something"
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
}

trap cleanup EXIT

if [ -z "$SCRIPT" ]
then 
    /usr/bin/script ./wsregister.txt /bin/bash -c "$0 $*"
    exit 0
fi

echo teste



