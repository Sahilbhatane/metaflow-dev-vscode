from metaflow import FlowSpec, Parameter, step


class TrainFlow(FlowSpec):
    epochs = Parameter('epochs', default=10, type=int, help='Number of training epochs')
    learning_rate = Parameter('lr', default=0.001, type=float)
    model_name = Parameter('model', required=True, help='Name of the model to train')
    verbose = Parameter('verbose', default=True, type=bool)

    @step
    def start(self):
        print(f"Training {self.model_name} for {self.epochs} epochs")
        self.next(self.end)

    @step
    def end(self):
        pass


if __name__ == '__main__':
    TrainFlow()
