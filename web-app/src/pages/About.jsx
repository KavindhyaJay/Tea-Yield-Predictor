import PageHeader from '../components/PageHeader.jsx'

export default function About() {
  return (
    <>
      <PageHeader title="About" subtitle="TeaYield Predictor" />

      <div className="ty-card max-w-2xl space-y-5 px-5 py-5 text-[13px] leading-relaxed text-ink">
        <section>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink">The application</h2>
          <p className="text-muted">
            TeaYield Predictor was developed as part of the tea yield prediction research project.
            It allows plantation officers to obtain a monthly made tea yield prediction from field
            and management data without working inside the notebook environment used during the
            research.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink">Model selection</h2>
          <p className="text-muted">
            Several machine learning models were evaluated during the research. Based on the
            selected evaluation metrics, CatBoost provided the strongest predictive performance and
            was therefore selected as the final prediction model for the application.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink">How predictions are made</h2>
          <p className="text-muted">
            The application uses the trained CatBoost model for inference. It does not retrain the
            model every time a prediction is requested. Submitted values pass through the same
            pre-processing pipeline that was fitted during the training phase before they reach the
            model.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink">Explainability</h2>
          <p className="text-muted">
            SHAP is used to explain the contribution of each input feature to an individual
            prediction. The SHAP Explanation screen shows how the features move the prediction from
            the model base value towards the final predicted yield, so the reasoning behind a
            prediction is available alongside the prediction itself.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-semibold text-ink">Reported metrics</h2>
          <p className="text-muted">
            The cross-validation metrics shown on the prediction result screen are the values
            obtained during the research evaluation. They describe performance on the evaluation
            data and are not a guarantee of accuracy on unseen plantation data.
          </p>
        </section>
      </div>
    </>
  )
}
