export function computeBest(values, mode = 'min') {
  if (!Array.isArray(values) || values.length === 0) return null;
  const nums = values.map(v => (typeof v === 'number' && !isNaN(v) ? v : null));
  if (nums.includes(null)) return null;
  let bestIndex = 0;
  for (let i = 1; i < nums.length; i++) {
    if (mode === 'min') {
      if (nums[i] < nums[bestIndex]) bestIndex = i;
    } else {
      if (nums[i] > nums[bestIndex]) bestIndex = i;
    }
  }
  const allEqual = nums.every(v => v === nums[0]);
  return allEqual ? null : bestIndex;
}

export function computeDiff(a, b) {
  if (a == null || b == null) return null;
  const maxVal = Math.max(Math.abs(a), Math.abs(b));
  if (maxVal === 0) return 0;
  return Math.abs(a - b) / maxVal * 100;
}
