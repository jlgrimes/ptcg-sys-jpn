import { TokenizedPhrase } from '../../effect-parser';

export class ParserError extends Error {
  constructor(
    message: string,
    public readonly phrase: TokenizedPhrase,
    public readonly parserName: string
  ) {
    super(message);
    this.name = 'ParserError';
  }

  toString(): string {
    return `${this.name} in ${this.parserName}: ${this.message}\nPhrase: "${
      this.phrase.text
    }"\nTokens: ${JSON.stringify(this.phrase.tokens, null, 2)}`;
  }
}
