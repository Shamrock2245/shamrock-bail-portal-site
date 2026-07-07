import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { getCourse, saveQuizResult } from 'backend/bailSchoolMongo';

let currentCourseId;
let currentStudentEmail;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};

$w.onReady(async function () {
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        wixLocation.to('/bail-school-login');
        return;
    }

    currentStudentEmail = await user.getEmail();
    currentCourseId = wixLocation.query.courseId || '120-HR-PRELICENSING';
    
    $w('#loadingSpinner').show();
    $w('#quizGroup').hide();
    $w('#resultGroup').hide();

    try {
        const course = await getCourse(currentCourseId);
        if (!course || !course.quiz) {
            throw new Error("Quiz data not found for this course.");
        }
        
        // Ensure random order for questions if required by FLDFS
        questions = course.quiz.questions.sort(() => Math.random() - 0.5);
        
        loadQuestion(0);
        $w('#quizGroup').show();
    } catch (e) {
        console.error("Quiz Error", e);
        $w('#errorText').text = "Failed to load quiz. Please contact support.";
        $w('#errorText').show();
    } finally {
        $w('#loadingSpinner').hide();
    }
});

function loadQuestion(index) {
    if (index >= questions.length) {
        submitQuiz();
        return;
    }
    
    currentQuestionIndex = index;
    const q = questions[index];
    
    $w('#questionNumberText').text = `Question ${index + 1} of ${questions.length}`;
    $w('#questionText').text = q.text;
    
    // Assuming a radio button group for answers
    const options = q.options.map((opt, i) => ({ label: opt, value: i.toString() }));
    $w('#answerRadioGroup').options = options;
    $w('#answerRadioGroup').value = userAnswers[index] || null;
    
    // Navigation buttons
    if (index === 0) {
        $w('#prevButton').disable();
    } else {
        $w('#prevButton').enable();
    }
    
    if (index === questions.length - 1) {
        $w('#nextButton').label = "Submit Final Exam";
    } else {
        $w('#nextButton').label = "Next Question";
    }
    
    $w('#prevButton').onClick(() => {
        saveAnswer();
        loadQuestion(index - 1);
    });
    
    $w('#nextButton').onClick(() => {
        if (!$w('#answerRadioGroup').value) {
            $w('#errorText').text = "Please select an answer.";
            $w('#errorText').show();
            return;
        }
        $w('#errorText').hide();
        saveAnswer();
        loadQuestion(index + 1);
    });
}

function saveAnswer() {
    userAnswers[currentQuestionIndex] = $w('#answerRadioGroup').value;
}

async function submitQuiz() {
    $w('#quizGroup').hide();
    $w('#loadingSpinner').show();
    
    // Calculate raw score client side just for immediate feedback, but backend verifies
    let correctCount = 0;
    questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctAnswerIndex.toString()) correctCount++;
    });
    
    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    
    try {
        // Send answers to backend for official grading and logging
        const result = await saveQuizResult(currentStudentEmail, currentCourseId, 'FINAL_EXAM', userAnswers, questions);
        
        $w('#loadingSpinner').hide();
        $w('#resultGroup').show();
        
        $w('#scoreText').text = `${result.score}%`;
        
        if (result.passed) {
            $w('#passFailText').text = "Congratulations! You passed.";
            $w('#passFailText').html = `<h2 style="color:#003300; font-family: Inter, sans-serif;">Congratulations! You passed.</h2>`;
            $w('#actionButton').label = "View Certificate";
            $w('#actionButton').onClick(() => wixLocation.to(`/bail-school/certificate/${currentCourseId}`));
        } else {
            $w('#passFailText').text = "You did not pass. FLDFS requires an 80% to pass.";
            $w('#passFailText').html = `<h2 style="color:#CC0000; font-family: Inter, sans-serif;">You did not pass.</h2>`;
            $w('#actionButton').label = "Retake Exam";
            $w('#actionButton').onClick(() => wixLocation.to(wixLocation.url)); // Reload page
        }
    } catch (e) {
        console.error(e);
        $w('#loadingSpinner').hide();
        $w('#errorText').text = "Failed to submit exam. Please try again.";
        $w('#errorText').show();
        $w('#quizGroup').show(); // Let them try submitting again
    }
}
