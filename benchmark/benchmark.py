import psutil
import sys
import signal
import time
import json


if len(sys.argv) == 1:
    print("No PID provided")
    sys.exit(1)

try:
    pid = int(sys.argv[1])
    print(pid)
except ValueError:
     print("Invalid PID provided")
     sys.exit(1)

process = psutil.Process(pid)

results = []
seconds = 0


def signal_handler(signal, frame):
    resultJson = json.dumps(results)
    with open('cpu_and_memory_usage.json', 'w') as f:
        f.write(resultJson)

    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

while(process.is_running()):
        # set the sleep time to monitor at an interval of every second.
        time.sleep(1)
        seconds += 1
        results.append({'TIME': seconds - 10, 'MEMORY': process.memory_info().vms / 1048576, 'CPU' : process.cpu_percent()})

