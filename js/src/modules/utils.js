/**
 * Finds a minimum range that accommodates both of the ranges a and b
 * 
 * @param {*} a range A 
 * @param {*} b range B 
 */
export function rangeUnion(a, b) {
    if (!a) {
        return b;

    } else if (!b) {
        return a;
    }

    return [
        Math.min(a[0], b[0]),
        Math.max(a[1], b[1])
    ]
}

/**
 * Intersects two ranges. If the ranges do not overlap, returns null.
 * 
 * @param {*} a range A
 * @param {*} b range B
 */
export function rangeIntersect(a, b) {
    if (!a || ! b) {
        return null;
    }

    const range = [
        Math.max(a[0], b[0]),
        Math.min(a[1], b[1])
    ]

    if (range[0] <= range[1]) {
        return range;
    } else {
        return null;
    }

}