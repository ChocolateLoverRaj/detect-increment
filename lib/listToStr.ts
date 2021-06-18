const listToStr = (list: string[]): string => list.length > 0
  ? list.join(', ')
  : '*none*'

export default listToStr
