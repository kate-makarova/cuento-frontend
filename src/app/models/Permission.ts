export interface PermissionMatrixObject {
  roles:       { [key: number]: string }
  permissions: { [key: string]: string }
  matrix:      {[key: string]: {[key: number]: boolean}}
}

enum PermissionType {
  "Endpoint Permission" = 0,
  "Subforum Permission" = 1
}
