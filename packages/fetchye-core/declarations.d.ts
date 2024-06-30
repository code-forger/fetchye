declare module 'create-shared-react-context' {
  export default function createSharedReactContext<T>(
    defaultValue: T, id: string
  ): React.Context<T>;
}
