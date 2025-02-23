import {CliContext} from "../types/CliContext";

class Router {
    public async run(route: [any, string]): Promise<void> {
        const ctx: CliContext = {args: process.argv.slice(3)};
        const [ControllerClass, methodName] = route;
        const controller = new ControllerClass(ctx);

        // Verify that the method exists
        if (typeof controller[methodName] !== 'function') {
            throw new Error(`Method ${methodName} not found on controller ${ControllerClass.name}`);
        }

        // Call the method (no additional parameters, since context is in the controller)
        await controller[methodName](ctx);
    }
}

const router = new Router();
export default router;