type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  errors?: string[];
};

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  errors,
}: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? errorId : undefined}
        className="h-10 rounded-md border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground/60 aria-[invalid=true]:border-red-500"
      />
      {errors && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
