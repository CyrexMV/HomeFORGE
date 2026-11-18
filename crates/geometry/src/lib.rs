use wasm_bindgen::prelude::*;

/// Calculates the floor area in square metres.
#[wasm_bindgen]
pub fn room_area(width: f64, length: f64) -> f64 {
    if !width.is_finite() || !length.is_finite() || width < 0.0 || length < 0.0 { return 0.0; }
    width * length
}

/// Returns the perimeter of a rectangular room in metres.
#[wasm_bindgen]
pub fn room_perimeter(width: f64, length: f64) -> f64 {
    if !width.is_finite() || !length.is_finite() || width < 0.0 || length < 0.0 { return 0.0; }
    2.0 * (width + length)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn area_is_correct() { assert_eq!(room_area(4.0, 3.0), 12.0); }
    #[test] fn perimeter_is_correct() { assert_eq!(room_perimeter(4.0, 3.0), 14.0); }
    #[test] fn rejects_invalid_dimensions() { assert_eq!(room_area(-2.0, 3.0), 0.0); }
}
