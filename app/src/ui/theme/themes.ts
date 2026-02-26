import { tokens } from './tokens'

export const lightTheme = {
  background: tokens.color.backgroundWarm,
  backgroundSecondary: tokens.color.surfaceWarm,
  color: tokens.color.textWarm,
  colorSecondary: tokens.color.textWarmSecondary,
  borderColor: tokens.color.borderWarm,
  primary: tokens.color.primarySage,
  primaryHover: tokens.color.primarySageSoft,
  secondary: tokens.color.primarySage,
  action: tokens.color.primarySage,
  danger: tokens.color.dangerSoft,
  success: tokens.color.green500,
}

export const darkTheme = {
  background: tokens.color.slate900,
  backgroundSecondary: tokens.color.slate800,
  color: tokens.color.slate50,
  colorSecondary: tokens.color.slate200,
  borderColor: tokens.color.slate700,
  primary: tokens.color.teal400,
  primaryHover: tokens.color.teal300,
  secondary: tokens.color.teal500,
  action: tokens.color.orange500,
  danger: tokens.color.red500,
  success: tokens.color.green500,
}
