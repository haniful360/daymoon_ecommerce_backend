export const ApiTags =
  (...tags: string[]) =>
  (target: any) =>
    target;
export const ApiOperation =
  (options?: any) => (target: any, key?: any, desc?: any) =>
    desc;
export const ApiResponse =
  (options?: any) => (target: any, key?: any, desc?: any) =>
    desc;
export const ApiBearerAuth =
  (name?: string) => (target: any, key?: any, desc?: any) =>
    desc;
export const ApiProperty = (options?: any) => (target: any, key?: any) => {};
export const ApiPropertyOptional =
  (options?: any) => (target: any, key?: any) => {};

export class DocumentBuilder {
  setTitle() {
    return this;
  }
  setDescription() {
    return this;
  }
  setVersion() {
    return this;
  }
  addBearerAuth() {
    return this;
  }
  addTag() {
    return this;
  }
  build() {
    return {};
  }
}

export const SwaggerModule = {
  createDocument: () => ({}),
  setup: () => {},
};
