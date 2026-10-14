export async function resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasExt = /\.[a-z0-9]+$/i.test(specifier);
    if (relative && !hasExt) {
        return nextResolve(`${specifier}.js`, context);
    }
    return nextResolve(specifier, context);
}
