export type DataStore<T> = {
    data: Record<string, T>,
    userData: Record<string, T>
    predefinedDataList: T[],
    userDataList: T[],
    allDataList: T[],
}