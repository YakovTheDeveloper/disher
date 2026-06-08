// Thrown by wallet.charge() when the user can't afford a feature. The route
// layer maps this to HTTP 402 Payment Required with { need, have } so the client
// can show a "пополни баланс" prompt.

export class InsufficientBalanceError extends Error {
  readonly needKop: number;
  readonly haveKop: number;

  constructor(needKop: number, haveKop: number) {
    super(`insufficient balance: need ${needKop} kop, have ${haveKop} kop`);
    this.name = "InsufficientBalanceError";
    this.needKop = needKop;
    this.haveKop = haveKop;
  }
}
