var twosums: Function = function(numbers: number[], target: number): number[] {
    const numMap = new Map<number, number>();
    for (let i = 0; i < numbers.length; i++) {
        const complement = target - numbers[i];
        if (numMap.has(complement)) {
            return [numMap.get(complement)!, i];
        }
        numMap.set(numbers[i], i);
    }
    throw new Error("No two sum solution found");
};