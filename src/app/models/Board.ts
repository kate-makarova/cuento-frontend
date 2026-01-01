export class Board {
  name: string;
  domainName: string;
  characterNumber: number;
  userNumber: number;

  constructor(name: string, domainName: string, characterNumber: number) {
    this.name = name;
    this.domainName = domainName;
    this.characterNumber = characterNumber;
    this.userNumber = characterNumber;
  }
}
