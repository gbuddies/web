
export function checkValidity({ form, setInpErrStatus }){
    let err_in_form = {};
    let isValid = true;

    for (let key in form){
        
        if (form[key] === ""){
            err_in_form[key] = true;
            isValid = false;
        }
        
        else {
            err_in_form[key] = false;
        }
    }

    setInpErrStatus(err_in_form);

    return isValid;
}