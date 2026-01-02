export class Field {
  fieldMachineName: string;
  fieldName: string;
  fieldValue: string;
  mode: 'display' | 'input';
  type: 'short_text' | 'long_text';
  showFieldName: boolean = true;
  customId: string|null = null;
  classNames: string[]|null = null;

  constructor(fieldMachineName: string, fieldName: string, fieldValue: string,
              mode: 'display' | 'input', type: 'short_text' | 'long_text',
              showFieldName: boolean = true,
              customId: string|null = null, classNames: string[]|null = null) {
    this.fieldMachineName = fieldMachineName;
    this.fieldName = fieldName;
    this.fieldValue = fieldValue;
    this.mode = mode;
    this.type = type;
    this.showFieldName = showFieldName;
    this.customId = customId;
    this.classNames = classNames;
  }
}
