/** Label above a compact rectangular input, or a select for `type: 'select'`. */
export default function Field({ field, value, onChange }) {
  const { key, label, type, step, options } = field

  return (
    <div>
      <label htmlFor={key} className="ty-label">
        {label}
      </label>

      {type === 'select' ? (
        <select
          id={key}
          name={key}
          value={value ?? ''}
          onChange={(event) => onChange(key, event.target.value)}
          className="ty-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366756B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-9"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={key}
          name={key}
          type={type}
          step={step}
          value={value ?? ''}
          onChange={(event) => onChange(key, event.target.value)}
          className="ty-input"
        />
      )}
    </div>
  )
}
