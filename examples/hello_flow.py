"""
Example Metaflow flow for manual testing of the VS Code extension.

To test parameter prompts:
  1. Open this file in VS Code with the extension installed
  2. Press Ctrl+Alt+R to run the flow
  3. You should see input prompts for 'greeting' and 'count'
     pre-filled with their defaults
  4. The final terminal command should look like:
     python hello_flow.py run --greeting='...' --count='...'

To test spin:
  1. Place your cursor inside the 'start' or 'end' method
  2. Press Ctrl+Alt+S
"""

from metaflow import FlowSpec, Parameter, step


class HelloFlow(FlowSpec):
    greeting = Parameter('greeting', default='hello world', type=str, help='Message to print')
    count = Parameter('count', default=3, type=int, help='How many times to repeat')

    @step
    def start(self):
        for i in range(self.count):
            print(f"{i + 1}: {self.greeting}")
        self.next(self.end)

    @step
    def end(self):
        print("Done!")


if __name__ == '__main__':
    HelloFlow()
