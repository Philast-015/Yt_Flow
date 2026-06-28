#!/usr/bin/env python3
import argparse
import sys
import webbrowser
from wave_twinx.server import create_app
from wave_twinx import config

blue = "\033[0;34m"
green = "\033[0;32m"
reset = "\033[0m"


def main():
    parser = argparse.ArgumentParser(description="Wave - YouTube browser")
    parser.add_argument("port", nargs="?", type=int, default=config.port, help="Port for web server")
    args = parser.parse_args()

    app = create_app()
    port = args.port
    url = f"http://localhost:{port}"
    print("\n\n", "-" * 20)
    print(f"|{green} Status : Active{reset}")
    print(f"|{blue} Url     : {url}{reset}")
    print(f"|{blue} Port    : {port}{reset}")
    print("-" * 20, "\n\n")
    if config.open:
        webbrowser.open(url)
    app.run(debug=config.debug, port=port)


if __name__ == "__main__":
    main()
