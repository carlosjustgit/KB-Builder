@echo off
echo Creating branch and committing milestone...

git checkout -b feat/context-aware-research-steps

git add .

git commit -m "feat: Implement context-aware research steps

- Fixed Brand, Services, and Market steps to use research context from step 1
- Updated research route to pass context for brand, services, and market steps
- Modified Perplexity client to generate structured brand identity documents
- Added StepContentContext integration to Brand component for Wit AI
- Fixed research context flow to prevent re-researching company information
- All steps now build upon initial research data creating cohesive KB

Major milestone: Research -> Brand -> Services -> Market -> Competitors flow working"

git push -u origin feat/context-aware-research-steps

echo.
echo Done! Branch created and pushed to GitHub.
pause

