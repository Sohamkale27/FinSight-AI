document.addEventListener("DOMContentLoaded", function () {

    const button = document.getElementById("getStartedBtn");

    button.addEventListener("click", function () {

        const featuresSection = document.getElementById("features");

        featuresSection.scrollIntoView({
            behavior: "smooth"
        });

    });

});
