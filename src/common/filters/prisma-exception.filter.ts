import { HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';


export function handlePrismaException(
  exception: Prisma.PrismaClientKnownRequestError,
  logger: Logger,
): { statusCode: number; message: string } {
  const { code, meta } = exception;

  // Try to extract the target field/model name gracefully
  const targetArray = meta?.target as string[] | undefined;
  let target = 'Record';
  if (Array.isArray(targetArray) && targetArray.length > 0) {
    target = targetArray.join(', ');
  } else if (meta?.modelName) {
    target = String(meta.modelName);
  }

  switch (code) {
    case 'P2000':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `${target} field value too long`,
      };
    case 'P2001':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `${target} does not exist`,
      };
    case 'P2002':
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `A record with this ${target} already exists`,
      };
    case 'P2003':
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Foreign key constraint failed on ${target}`,
      };
    case 'P2004':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Constraint failed on ${target}`,
      };
    case 'P2005':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid value provided for ${target} field`,
      };
    case 'P2006':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid data provided for ${target} field`,
      };
    case 'P2007':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Data validation error on ${target}`,
      };
    case 'P2008':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed query parsing`,
      };
    case 'P2009':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed query validation`,
      };
    case 'P2010':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Raw query failed`,
      };
    case 'P2011':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Null constraint violation on ${target}`,
      };
    case 'P2012':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `${target} missing required value`,
      };
    case 'P2013':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Missing required argument for ${target}`,
      };
    case 'P2014':
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Invalid relation: ${target} has conflicting records`,
      };
    case 'P2015':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Related ${target} not found`,
      };
    case 'P2016':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Query interpretation error`,
      };
    case 'P2017':
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Relation record not found for ${target}`,
      };
    case 'P2018':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Required connected records not found`,
      };
    case 'P2019':
      return { statusCode: HttpStatus.BAD_REQUEST, message: `Input error` };
    case 'P2020':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Value out of range for ${target}`,
      };
    case 'P2021':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Table ${target} not found`,
      };
    case 'P2022':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Column for ${target} not found`,
      };
    case 'P2023':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Inconsistent column data`,
      };
    case 'P2024':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Timed out fetching ${target}`,
      };
    case 'P2025':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `${target} not found`,
      };
    case 'P2026':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Unsupported feature requested`,
      };
    case 'P2027':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Multiple errors occurred during query`,
      };
    case 'P2028':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Transaction API error`,
      };
    case 'P2030':
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Database schema is out of date`,
      };
    case 'P2033':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Number out of range for ${target}`,
      };
    case 'P2034':
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Transaction was aborted`,
      };
    default:
      logger.error(`Prisma Error [${code}]: ${exception.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Database error occurred`,
      };
  }
}
