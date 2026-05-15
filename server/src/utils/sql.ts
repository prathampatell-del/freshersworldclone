export class ParamBuilder {
  readonly params: unknown[] = [];

  push(value: unknown): string {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  next(): string {
    return `$${this.params.length + 1}`;
  }
}
