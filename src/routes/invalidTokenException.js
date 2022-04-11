const invalidTokenException = () => {
    this.message = "Account Activation Failure";
    this.status = 400;
}

export default invalidTokenException