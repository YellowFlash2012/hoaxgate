const validationException = (errors) => {
    this.status = 400;

    this.errors = errors;

    this.message = "Validation Failure"
}

export default validationException