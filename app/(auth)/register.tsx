import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { AuthScreenShell } from "@/src/features/auth/shell";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/src/lib/validation/auth";
import { registerUser } from "@/src/services/firebase/auth";
import type { Role } from "@/src/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export default function RegisterScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "physiotherapist",
    },
  });
  const role = watch("role");

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role as Role,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "No se pudo crear la cuenta";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthScreenShell
      title="Crear Cuenta"
      subtitle="Registra tu acceso y elige el rol con el que usarás la app."
      footerHref="/(auth)/login"
      footerLabel="Ya tengo cuenta"
    >
      <VStack space="md">
        <FormControl isInvalid={Boolean(errors.name)}>
          <FormControlLabel>
            <FormControlLabelText>Nombre</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  placeholder="Nombre completo"
                />
              </Input>
            )}
          />
          {errors.name ? (
            <FormControlError>
              <FormControlErrorText>{errors.name.message}</FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <FormControl isInvalid={Boolean(errors.email)}>
          <FormControlLabel>
            <FormControlLabelText>Correo</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="correo@dominio.com"
                />
              </Input>
            )}
          />
          {errors.email ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.email.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <FormControl isInvalid={Boolean(errors.password)}>
          <FormControlLabel>
            <FormControlLabelText>Contraseña</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  placeholder="Mínimo 6 caracteres"
                />
              </Input>
            )}
          />
          {errors.password ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.password.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <FormControl isInvalid={Boolean(errors.confirmPassword)}>
          <FormControlLabel>
            <FormControlLabelText>Confirmar contraseña</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  placeholder="Repite tu contraseña"
                />
              </Input>
            )}
          />
          {errors.confirmPassword ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.confirmPassword.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <Controller
          control={control}
          name="role"
          render={({ field: { onChange } }) => (
            <VStack space="xs">
              <Text className="font-medium text-foreground">Rol</Text>
              <Box className="flex-row gap-2">
                <Pressable
                  className={
                    role === "physiotherapist"
                      ? "flex-1 items-center rounded-md border border-primary bg-primary px-4 py-3"
                      : "flex-1 items-center rounded-md border border-border bg-background px-4 py-3"
                  }
                  onPress={() => onChange("physiotherapist")}
                >
                  <Text
                    className={
                      role === "physiotherapist"
                        ? "font-medium text-primary-foreground"
                        : "font-medium text-foreground"
                    }
                  >
                    Fisio
                  </Text>
                </Pressable>

                <Pressable
                  className={
                    role === "patient"
                      ? "flex-1 items-center rounded-md border border-primary bg-primary px-4 py-3"
                      : "flex-1 items-center rounded-md border border-border bg-background px-4 py-3"
                  }
                  onPress={() => onChange("patient")}
                >
                  <Text
                    className={
                      role === "patient"
                        ? "font-medium text-primary-foreground"
                        : "font-medium text-foreground"
                    }
                  >
                    Paciente
                  </Text>
                </Pressable>
              </Box>
            </VStack>
          )}
        />

        {error ? (
          <Box className="rounded-md bg-destructive/10 px-3 py-2">
            <Text className="text-sm text-destructive">{error}</Text>
          </Box>
        ) : null}

        <Button onPress={onSubmit} disabled={submitting}>
          {submitting ? <ButtonSpinner color="white" /> : null}
          <ButtonText>Crear Cuenta</ButtonText>
        </Button>
      </VStack>
    </AuthScreenShell>
  );
}
