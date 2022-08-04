export class TrieNode {
  _children: Array<null | TrieNode> = new Array(26).fill(null)
  _endOfWord: boolean = false
  _value: (string|null) = null

  constructor(value: (string|null|undefined)){
    if(value === undefined){
      this._value = null
    } else {
      this._value = value
    }
  }

  get children() {
    return this._children
  }
  set children(newChildren){
    this._children = newChildren
  }

  get endOfWord(){
    return this._endOfWord
  }
  set endOfWord(eowVal){
    this._endOfWord = eowVal
  }

  get value(){
    return this._value
  }
  set value(newVal){
    this._value = newVal
  }

  get intValue(){
    if(this._value !== null){
      return TrieNode.charIntVal(this._value)
    } else {
      return null
    }
  }

  static charIntVal(char: string){
    return char.charCodeAt(0) - "a".charCodeAt(0)
  }
}

