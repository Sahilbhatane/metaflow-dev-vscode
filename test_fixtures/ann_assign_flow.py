from metaflow import FlowSpec, Parameter, step


class AnnFlow(FlowSpec):
    epochs: int = Parameter('epochs', default=5, type=int)

    @step
    def start(self):
        print(self.epochs)
        self.next(self.end)

    @step
    def end(self):
        pass


if __name__ == '__main__':
    AnnFlow()
