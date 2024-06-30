The only typeless barrier i have found so far is mapOptionsToKey

We _do_ expect certain things to be returned by it. But only in 2 ways:
1. So we can discard them from the cache key
2. So we can typecheck then, then call them

In this way, it _actually_ doesnt matter what this function returns. it can be Record<string, unknown>

However, this makes TS angry, because it doesnt understand that this socked is used in such a way.

So.... we lose type information. This is entirely contained in the computeKey.ts file

It turns out however we do work to preserve the `headers` field. So this still needs to by strongly typed

Therefore `PostMapOptions` is created over Record<string, unknown> to force the socket plug to preserve the shape of the headers field if it exists






`options` are no long optional... is this a problem?




# Fetchye Type System

This type system was made with a few philosophies in mind:

1. If the caller is using the default FetchClient and Fetcher, they should should see 0 type 'shenanigans'
2. Internal code is as specifically typed as possible, to ensure we can handle any FetchClient and Fetcher the caller might provide
3. If the caller is using a custom FetchClient or Fetcher, These functions should seamlessly agree on the type of their shared constructs (the `key` and `options`)
   4. (Ideally the caller should see 0 type 'shenanigans' here too, but since the FetchClient is passed into the FetchyeProivder, the caller must unfortunately also 'hint' to useFetchye what the FetchClient's type is.)
4. There should be as few logic changes as possible, and certainly limited to fixing bugs that came up during the transformation.

With this in mind, the type system is complex.

It needs to be able to handle any FetchClient and Fetcher the user might provide. And indeed, during this transformation there were a number of places where fetchye 'assumed' the default FetchClient was in place.

Before you dive into the code, here are a few key concepts to keep in mind:

## TFetchClient and TFetcher

The core of this type system is the `TFetchClient` and `TFetcher` types.

You will see them across the entire codebase, along with their friends `GenericFetchClient` and `GenericFetcher`, and their derivatives `AllOptions`.

They bridge three Properties of the type system:

A) The purpose of these types is to ensure that `useFetchye` and `makeServerFetchye` require the user to pass a `key` and `options` that are compatible with the FetchClient and Fetcher.

B) For their double duty, `TFetchClient` and `TFetcher` have their options extracted and combined, such that `mapOptionsToKey` and `mapKeyToCacheKey` are provided with an exhaustive Options type.

C) `TFetchClient` and `TFetcher` finally do triple duty to ensure any `FetchClient` and `Fetcher` the caller might specify agree on the type of the key and options they are using.

To put the above in more plane language, `TFetchClient` and `TFetcher` ensure:

1. (A) the `key` passed as the first parameter to `useFetchye` and `makeServerFetchye` is the type expected by the `FetchClient`
2. (A) the `options` passed as the second parameter to `useFetchye` and `makeServerFetchye` is a combination of:
   3. The options expected by the `FetchClient` (such as `method` and `headers` for the default FetchClient `fetch`)
   4. The additional options expected by the `Fetcher` (There are none in the default Fetcher, but custom fetchers often extract and manipulate options before passing them to the `FetchClient`)
   5. The native options that Fetchye extracts and uses (such as `defer` and `mapOptionsToKey`)
6. (B) When the caller provides a `mapOptionsToKey` function, inside that function they can only use the options that are expected by the `FetchClient` and `Fetcher`.
7. (C) When the caller provides a custom `FetchClient` or `Fetcher`, all of the above still magically works. Ensuring no-one can pass `useFetchye` an option that it doesn't want.

Lets see some code examples for these three properties, A, B, and C


### Default UseCase
In this example, the user is using the default fetchClient and fetcher.

Since the default fetcher is `fetch` passing a `string` as the key is ok, since that is compatible with `RequestInfo | URL`

Additionally the options provided are compatible with RequestInit.
```ts
  const { data } = useFetchye(
    'myKey',
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
  );
```

### Custom Fetcher and FetchClient

Here you can see all the ways the type system keeps things compatible.

```ts
  type MyFetchClient = (
    key: boolean,                  // (1.1)
    options: { color: string }     // (2.1)
  ) => ReturnType<typeof FetchClient<any, any>>;

  const UrgencyFilterFetcher: Fetcher<MyFetchClient, { urgency: number }> = async ( // (3.1)
    fetchClient,
    key,
    options
  ) => {
    if(options.urgency < 10 && global.currentUrgency > 10) { // (3.2)
      return { error: new Error('Dropping non-urgent request') };
    }
    const response = await fetchClient(!key, options); // (1.2)
    const body = await response.text();
    return {
      payload: {
        body,
        ok: response.ok,
        headers: {},
        status: response.status,
      },
      error: undefined,
    };
  };


  const { data } = useFetchye<MyFetchClient>(
    true,
    {
      color: 'green', // (2.2)
      urgency: 4,      // (3.3)
      mapOptionsToKey: ({urgency, defer, ...otherOptions}) => otherOptions, // (4.1)
    },
    UrgencyFilterFetcher
  );
```

Looking at the annotations in this code:

(1) The FetchClient sets the key type

(1.1) here the fetch client declares it wants a bool as a key

(1.2) since the fetcher is built to use this fetchClient, it knows the key is a bool, and can invert it

(2) The FetchClient sets its options

(2.1) here the fetch client declares it wants an object with a color string as the options

(2.2) The caller must pass a color in, becuase the fetch client needs it

(3) The Fetcher sets some additional options

(3.1) The fetcher wants an object with an urgency number

(3.2) The fetcher can use the options to decide if it should drop the request

(3.3) The caller must pass an urgency in, becuase the fetcher needs it

(4) The mapOptionsToKey function is stongly typed

(4.1) the mapOptionsToKey function knows the full set of options it can use! it choses to filter out some of the props (note that `defer` here comes from the Native Fetchye Options)

## GenericFetchClient and GenericFetcher

You will see these two types in the Generics of many other types and functions.

it will almost always look like

```ts
const MyFunction = <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>(/* some params */) => { /* some code */}
```

You **MUST NOT** use either GenericFetchClient or GenericFetcher directly. You must always use the `TFetchClient` and `TFetcher` types. GenericFetchClient and GenericFetcher are only to be used to constrain the `TFetchClient` and `TFetcher` types in Generic parameters.

This might seem daunting, but it is an unfortunate necessity of the pluggable FetchClient and Fetcher system.

Ultimately, if your functions needs to get a hold of _anything_ derived from the FetchClient or Fetcher, it will need the above.

For example, lets look at a simple function that logs all the options

```ts
const logOptions = <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>(options: AllOptions<TFetchClient, TFetcher>) => {
  console.log(options);
}
```

Here, to derive the real type for `options` we need to use the `AllOptions` helper (explained below)

This takes our two generics as inputs, so logOptions also need them.

However, in almost all circumstances you **do not need to pass these generics in when calling the function**

```ts
logOptions(options);
```

This will work anywhere you already have the `option` without generics, because TS can infer from the type of `options` what the types of TFetchClient and TFetcher are.

## AllOptions and its very many friends

`AllOptions` is a helper type that takes the FetchClient and Fetcher and returns the combined options type, including all the NativeOptions fetchye itself expects.

The stick in the mud is that an ideal `Options` type contains a function `mapOptionsToKey`, which would have a signature like `(options: Options) => Options`.

This sort of recursive type is not so simple in TS, especially as `Options` must be derived from `TFetchClient` and `TFetcher`.

This leads to a few layers of Options type, which are self documented in `OptionsTypeHelpers.ts`

The other major hurdle with an ideal `Options` type is that almost every function that takes the options transform them in some way:

1. `handleDymamicHeaders` takes the options and if the `headers` field is a function, it calls it
2. `computeKey` extracts `headers` and `mapKeyToCacheKey` from the options
3. `defaultMapOptionsToKey` extracts another 4 or so keys from the options

This means we need a number of `Options` types to handle the various transformations, such as `FetchyeNativeOptions` and `ResolvedFetchyeNativeOptions` for the Native Fetchye Options before and after `handleDynamicHeaders` is called.

But worst of all `mapOptionsToKey` is a function that transforms the options that is specified by the caller.

This means we simply cannot maintain good types over this function call. However, luckily we do very little with the options after this function has been called.

The only things we do are optionally transform the `headers` and `mapKeyToCacheKey` fields.

Therefore, we have `PostMapOptions` to describe a far simpler structure to `Options` after it comes back from the caller.

## External Caches are untyped.

This entire system can work on any provided cache of type FetchyeCache. However, that type has `<any, any> as its default generic`

This is not ideal becuase we _could_ infer both the ReduxShape and the CacheShape from the provided cache.

We know this is possible because we did exactly this with TFetchClient and TFetcher.

So why not introduce a TFetchyeCache type that is generic over the ReduxShape and CacheShape?

To put it simply, it would be a lot of extra code for very little benerit

Every function that currently takes TFetchClient and TFetcher would also need to take TFetchyeCache. Meaning essentially every function would need this.

However, it is exceedingly rare for caller to want to bring their own cache. We provide a few, and there are not many more caches one could imagine.

So what do we lose?

1. in FetchyeProvider we have UntypedCacheShape. This means that we have no type guarantee that fetchyeState.current (which is to say the 'ReducerShape.current is the CacheShape').

This code does not expose this problem particularly well, because this cache implementation does not define or use a `cacheSelector` function, whose job it is to select the CacheShape from the ReducerShape.

This doesn't matter here becuase its 'trivial' to see that `.current` is the correct Selector, since its a React.Ref (which places your value in .current) and this cache occupies the 'entire' reducer shape.

2. When creating a new Cache, if the author allows the default <any, any> to apply, they will not get type errors if their cache functions do not agree on the various shapes.

Recall that the entire point of the TFetchClient, TFetcher system was to ensure that when authoring Fetchers and FetchClients, they would agree on the type of their shared constructs (TKey and TOptions)

So, when making a cache, the 3 funcions inside would _not_ be forced to agree on their shared constructs (TReduxShape and TCacheShape) if the author allowed the default <any, any> to apply.

If, however they type their cache with `FetchyeCache<RealReduxShape, RealCacheShape>` then they _would_ be forced to agree on these shapes.

### Conclusion

So there are a couple of line of type unsafe code in our FetchyeProvider (because it technically implements a cache over <any, any>), and when callers make their own cache, they _can_ be type unsafe.

But as mentioned, it's exceedingly rare for a caller to want to bring their own cache. And if they do, they _can_ type it correctly.
