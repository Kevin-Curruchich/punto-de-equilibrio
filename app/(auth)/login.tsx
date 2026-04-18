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
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { AuthScreenShell } from "@/src/features/auth/shell";
import { loginSchema, type LoginFormValues } from "@/src/lib/validation/auth";
import { signInUser } from "@/src/services/firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export default function LoginScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    try {
      await signInUser(values.email, values.password);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "No se pudo iniciar sesión";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthScreenShell
      title="Iniciar Sesión"
      subtitle="Accede a tu cuenta para continuar con tu panel clínico."
      footerHref="/(auth)/register"
      footerLabel="Crear cuenta"
    >
      <VStack space="md">
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
                  placeholder="Contraseña"
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

        {error ? (
          <Box className="rounded-md bg-destructive/10 px-3 py-2">
            <Text className="text-sm text-destructive">{error}</Text>
          </Box>
        ) : null}

        <Button onPress={onSubmit} disabled={submitting}>
          {submitting ? <ButtonSpinner color="white" /> : null}
          <ButtonText>Entrar</ButtonText>
        </Button>
      </VStack>
    </AuthScreenShell>
  );
}
