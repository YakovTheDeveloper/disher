// export type Response<Data> = {
//     result: Data
//     error: any
// }

export type Response<Data> =
    { data: Data; isError: false }
    | { isError: true; error: string };
