export class SSDT {
    msbuildPath: string;
    sqlPackagePath: string = '';

    constructor(msbuildPath: string) {
        this.msbuildPath = msbuildPath;
    }

    build(location: string): void {
        console.log('test');
    }
}